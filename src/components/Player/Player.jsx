import React, { useRef, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  IoPlay, IoPause, IoPlaySkipForward, IoPlaySkipBack,
  IoShuffle, IoRepeat, IoVolumeHigh, IoVolumeMute, IoVolumeMedium,
  IoHeart, IoHeartOutline, IoList
} from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import { getMediumQualityImage, decodeHTML, getArtistNames, formatDuration } from '../../utils/helpers';
import ExpandedPlayer from '../ExpandedPlayer/ExpandedPlayer';
import './Player.css';

export default function Player() {
  const location = useLocation();
  const {
    currentSong, isPlaying, togglePlay, nextSong, prevSong,
    duration, currentTime, seekTo, volume, setVolume,
    isMuted, toggleMute, isShuffled, toggleShuffle,
    repeatMode, cycleRepeat, toggleLike, isLiked,
    toggleQueue, showQueue, isLoading,
  } = usePlayer();

  const [expanded, setExpanded] = useState(false);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);

  const handleProgressClick = useCallback((e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(percent * duration);
  }, [duration, seekTo]);

  const handleVolumeClick = useCallback((e) => {
    const rect = volumeRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
  }, [setVolume]);

  if (!currentSong || location.pathname === '/cuts') return null;

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;
  const liked = isLiked(currentSong.id);
  const VolumeIcon = isMuted || volume === 0 ? IoVolumeMute : volume < 0.5 ? IoVolumeMedium : IoVolumeHigh;

  return (
    <>
      {/* Expanded full-screen player */}
      {expanded && <ExpandedPlayer onClose={() => setExpanded(false)} />}

      <div className="player-wrapper">
        <div className="player" id="player-bar">
          {/* Left: Song Info — click to expand */}
          <div className="player__song" id="player-song-info" onClick={() => setExpanded(true)} style={{ cursor: 'pointer' }}>
            <img className={`player__song-image ${isPlaying ? 'playing' : ''}`} src={getMediumQualityImage(currentSong.image)} alt={decodeHTML(currentSong.name)} />
            <div className="player__song-info">
              <div className="player__song-title">
                {isPlaying && <span className="playing-emoji" style={{ marginRight: '6px' }}>🎵</span>}
                {decodeHTML(currentSong.name)}
              </div>
              <div className="player__song-artist">{getArtistNames(currentSong.artists, currentSong.primaryArtists)}</div>
            </div>
            <button className={`player__like-btn desktop-only ${liked ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }} id="player-like-btn">
              {liked ? <IoHeart /> : <IoHeartOutline />}
            </button>
          </div>

      {/* Center: Controls (Desktop) */}
      <div className="player__controls" id="player-controls">
        <div className="player__controls-buttons">
          <button className={`player__control-btn ${isShuffled ? 'active' : ''}`} onClick={toggleShuffle} id="shuffle-btn"><IoShuffle /></button>
          <button className="player__control-btn" onClick={prevSong} id="prev-btn"><IoPlaySkipBack /></button>
          <button className="player__play-btn" onClick={togglePlay} id="play-pause-btn">
            {isPlaying ? <IoPause /> : <IoPlay style={{ marginLeft: 2 }} />}
          </button>
          <button className="player__control-btn" onClick={nextSong} id="next-btn"><IoPlaySkipForward /></button>
          <button className={`player__control-btn ${repeatMode !== 'off' ? 'active' : ''}`} onClick={cycleRepeat} id="repeat-btn">
            <IoRepeat />
            {repeatMode === 'one' && <span style={{ position: 'absolute', fontSize: 8, fontWeight: 700, bottom: -2, right: -2 }}>1</span>}
          </button>
        </div>
        <div className="player__progress" id="player-progress">
          <span className="player__progress-time">{formatDuration(currentTime)}</span>
          <div className="player__progress-bar" ref={progressRef} onClick={handleProgressClick}>
            <div className="player__progress-fill" style={{ width: `${progressPercent}%` }}>
              <div className="player__progress-thumb" />
            </div>
          </div>
          <span className="player__progress-time">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Right: Volume & Extra (Desktop) */}
      <div className="player__extra" id="player-extra">
        <button className={`player__extra-btn ${showQueue ? 'active' : ''}`} onClick={toggleQueue} id="queue-toggle-btn"><IoList /></button>
        <div className="player__volume" id="player-volume">
          <button className="player__extra-btn" onClick={toggleMute}><VolumeIcon /></button>
          <div className="player__volume-bar" ref={volumeRef} onClick={handleVolumeClick}>
            <div className="player__volume-fill" style={{ width: `${volumePercent}%` }}>
              <div className="player__volume-thumb" />
            </div>
          </div>
        </div>
      </div>

        {/* Mobile Controls */}
        <div className="player__mobile-controls">
          <button className={`player__like-btn mobile-only ${liked ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); toggleLike(currentSong); }}>
            {liked ? <IoHeart /> : <IoHeartOutline />}
          </button>
          <button className="player__mobile-play" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
            {isPlaying ? <IoPause /> : <IoPlay style={{ marginLeft: 2 }} />}
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
